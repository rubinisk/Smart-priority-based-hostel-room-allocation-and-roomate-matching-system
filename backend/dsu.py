"""
StayWise — Advanced Data Structure: Disjoint Set Union (DSU / Union-Find)

Provides efficient near-constant time O(alpha(N)) group connectivity checking,
cycle/overlap validation, and union operations with path compression and union by rank.
"""

class DisjointSetUnion:
    def __init__(self):
        # parent[x] points to parent of x in the tree
        self.parent = {}
        # rank[x] tracks tree height bound for union by rank
        self.rank = {}
        # size[x] tracks the number of elements in the component rooted at x
        self.size = {}

    def make_set(self, x):
        """Initializes an element x as its own independent component."""
        if x not in self.parent:
            self.parent[x] = x
            self.rank[x] = 0
            self.size[x] = 1

    def find(self, x):
        """
        Finds the canonical representative of the set containing x with Path Compression.
        Path compression flattens the tree so all visited nodes point directly to the root.
        Amortized time: O(alpha(N)) where alpha is the inverse Ackermann function.
        """
        if x not in self.parent:
            self.make_set(x)
            return x

        # Path compression: recursively find root and re-parent node directly to root
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        """
        Merges the sets containing x and y using Union by Rank.
        Attaches the root of the shallower tree under the root of the deeper tree.
        Returns True if a merge occurred, or False if x and y were already in the same set.
        """
        root_x = self.find(x)
        root_y = self.find(y)

        if root_x == root_y:
            return False  # Already in the same set

        # Union by rank: attach smaller rank tree under larger rank tree
        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
            self.size[root_y] += self.size[root_x]
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
            self.size[root_x] += self.size[root_y]
        else:
            self.parent[root_y] = root_x
            self.size[root_x] += self.size[root_y]
            self.rank[root_x] += 1

        return True

    def connected(self, x, y):
        """Returns True if x and y belong to the same component/group, False otherwise."""
        return self.find(x) == self.find(y)

    def get_set_size(self, x):
        """Returns the number of elements in the component containing x."""
        root = self.find(x)
        return self.size.get(root, 1)

    def can_form_group(self, member_ids, max_group_size=4):
        """
        Validates if the provided member_ids can form a valid group.
        Checks:
        1. Group size does not exceed max_group_size.
        2. No member is already connected to another member outside of this candidate set.
        """
        if len(member_ids) > max_group_size:
            return False, f"Group size {len(member_ids)} exceeds maximum capacity of {max_group_size}."

        # Check for overlaps: elements must not already belong to another multi-node group
        roots = set()
        for m in member_ids:
            r = self.find(m)
            # If size of component is > 1 and it contains members not in this proposed set, conflict!
            if self.get_set_size(m) > 1 and r not in roots:
                # Check if all members of this component are part of member_ids
                component_members = [k for k in self.parent if self.find(k) == r]
                if any(cm not in member_ids for cm in component_members):
                    return False, f"Student ID {m} is already part of an active confirmed group."
            roots.add(r)

        return True, "Valid group structure."

    def rebuild_from_db(self, active_groups):
        """
        Reconstructs the DSU state cleanly from the authoritative database active groups.
        Required when group invitations are rejected, cancelled, or modified,
        as standard DSU does not support set splitting / element deletion directly.
        """
        self.parent.clear()
        self.rank.clear()
        self.size.clear()

        for grp in active_groups:
            members = grp.get('member_ids', [])
            if not members:
                continue
            leader = members[0]
            self.make_set(leader)
            for m in members[1:]:
                self.make_set(m)
                self.union(leader, m)
